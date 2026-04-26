import { message } from 'ant-design-vue';
import type { Router } from 'vue-router';

const STORAGE_PREFIX = 'auditit:form-draft:';
const CONTROL_SELECTOR = [
  'input:not([type="hidden"]):not([type="password"]):not([type="file"])',
  'textarea',
  'select',
].join(',');

type DraftControl = {
  key: string;
  tag: string;
  type: string;
  value: string;
  checked?: boolean;
};

type DraftForm = {
  index: number;
  controls: DraftControl[];
};

type DraftPayload = {
  path: string;
  savedAt: string;
  forms: DraftForm[];
};

let activePath = '';
let restoring = false;
let lastToastAt = 0;
let installed = false;
const dirtyPaths = new Set<string>();

const storageKey = (path: string) => `${STORAGE_PREFIX}${path}`;

const isTextInput = (
  control: Element
): control is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement =>
  control instanceof HTMLInputElement ||
  control instanceof HTMLTextAreaElement ||
  control instanceof HTMLSelectElement;

const isUsableControl = (control: Element): control is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement => {
  if (!isTextInput(control) || control.disabled || control.closest('[data-form-draft-ignore="true"]')) {
    return false;
  }

  if (control instanceof HTMLInputElement) {
    const ignoredTypes = new Set(['button', 'submit', 'reset', 'image']);
    if (ignoredTypes.has(control.type)) {
      return false;
    }
  }

  return !!control.closest('form, .ant-form');
};

const cleanText = (value: string | null | undefined) => (value || '').replace(/\s+/g, ' ').trim();

const getControlKey = (
  control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  controlIndex: number
) => {
  const formItem = control.closest('.ant-form-item');
  const label = cleanText(formItem?.querySelector('.ant-form-item-label label')?.textContent);
  const name = cleanText(control.getAttribute('name'));
  const id = cleanText(control.getAttribute('id'));
  const placeholder = cleanText(control.getAttribute('placeholder'));
  const ariaLabel = cleanText(control.getAttribute('aria-label'));

  return [name, id, ariaLabel, label, placeholder, control.tagName.toLowerCase(), control.type, controlIndex]
    .filter(Boolean)
    .join('|');
};

const controlHasContent = (control: DraftControl) => {
  if (control.type === 'checkbox' || control.type === 'radio') {
    return !!control.checked;
  }

  return control.value.trim().length > 0;
};

const collectDraft = (path: string): DraftPayload | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const forms = Array.from(document.querySelectorAll('form, .ant-form'));
  const draftForms = forms
    .map((form, formIndex) => {
      const controls = Array.from(form.querySelectorAll(CONTROL_SELECTOR))
        .filter(isUsableControl)
        .map((control, controlIndex): DraftControl => {
          const isCheckedInput = control instanceof HTMLInputElement && ['checkbox', 'radio'].includes(control.type);
          return {
            key: getControlKey(control, controlIndex),
            tag: control.tagName.toLowerCase(),
            type: control instanceof HTMLInputElement ? control.type : control.tagName.toLowerCase(),
            value: control.value,
            checked: isCheckedInput ? control.checked : undefined,
          };
        });

      return { index: formIndex, controls };
    })
    .filter(form => form.controls.some(controlHasContent));

  if (draftForms.length === 0) {
    return null;
  }

  return {
    path,
    savedAt: new Date().toISOString(),
    forms: draftForms,
  };
};

const saveCurrentRouteDraft = (path: string, notify: boolean) => {
  if (!path || !dirtyPaths.has(path)) {
    return;
  }

  const draft = collectDraft(path);
  try {
    if (draft) {
      sessionStorage.setItem(storageKey(path), JSON.stringify(draft));
      if (notify) {
        const now = Date.now();
        if (now - lastToastAt > 1000) {
          message.success('内容已暂存');
          lastToastAt = now;
        }
      }
    } else {
      sessionStorage.removeItem(storageKey(path));
    }
  } catch {
    // Storage may be unavailable in private browsing or full quota states.
  } finally {
    dirtyPaths.delete(path);
  }
};

const setControlValue = (
  control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  draft: DraftControl
) => {
  if (control instanceof HTMLInputElement && ['checkbox', 'radio'].includes(control.type)) {
    control.checked = !!draft.checked;
  } else {
    const prototype =
      control instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : control instanceof HTMLSelectElement
          ? HTMLSelectElement.prototype
          : HTMLInputElement.prototype;
    const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    valueSetter?.call(control, draft.value);
  }

  control.dispatchEvent(new Event('input', { bubbles: true }));
  control.dispatchEvent(new Event('change', { bubbles: true }));
};

const restoreRouteDraft = (path: string) => {
  if (typeof document === 'undefined') {
    return;
  }

  const raw = sessionStorage.getItem(storageKey(path));
  if (!raw) {
    return;
  }

  let draft: DraftPayload;
  try {
    draft = JSON.parse(raw) as DraftPayload;
  } catch {
    sessionStorage.removeItem(storageKey(path));
    return;
  }

  restoring = true;
  try {
    const draftByFormIndex = new Map(draft.forms.map(form => [form.index, form]));
    Array.from(document.querySelectorAll('form, .ant-form')).forEach((form, formIndex) => {
      const draftForm = draftByFormIndex.get(formIndex);
      if (!draftForm) {
        return;
      }

      const controls = Array.from(form.querySelectorAll(CONTROL_SELECTOR)).filter(isUsableControl);
      const draftByKey = new Map(draftForm.controls.map(control => [control.key, control]));
      controls.forEach((control, controlIndex) => {
        const key = getControlKey(control, controlIndex);
        const draftControl = draftByKey.get(key);
        if (draftControl) {
          setControlValue(control, draftControl);
        }
      });
    });
  } finally {
    restoring = false;
  }
};

const markActiveRouteDirty = (event: Event) => {
  if (restoring || !activePath || !(event.target instanceof Element)) {
    return;
  }

  if (isUsableControl(event.target)) {
    dirtyPaths.add(activePath);
  }
};

export const installFormDraftPersistence = (router: Router) => {
  if (installed || typeof window === 'undefined') {
    return;
  }

  installed = true;
  activePath = router.currentRoute.value.fullPath;

  document.addEventListener('input', markActiveRouteDirty, true);
  document.addEventListener('change', markActiveRouteDirty, true);
  window.addEventListener('pagehide', () => saveCurrentRouteDraft(activePath, false));

  router.beforeEach((_to, from, next) => {
    saveCurrentRouteDraft(from.fullPath, true);
    next();
  });

  router.afterEach(to => {
    activePath = to.fullPath;
    window.setTimeout(() => restoreRouteDraft(to.fullPath), 0);
    window.setTimeout(() => restoreRouteDraft(to.fullPath), 250);
  });
};
