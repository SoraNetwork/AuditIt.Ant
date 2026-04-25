export type PlatformFieldKey = 'xianyuId' | 'taobaoId' | 'xiaohongshuId';

export interface PlatformFields {
  xianyuId?: string | null;
  taobaoId?: string | null;
  xiaohongshuId?: string | null;
}

export const PLATFORM_TEMPLATES: Array<{ key: PlatformFieldKey; label: string; aliases: string[] }> = [
  {
    key: 'xianyuId',
    label: '闲鱼_ID',
    aliases: ['闲鱼_ID', '闲鱼(平台)_ID', '闲鱼ID', 'xianyu_id'],
  },
  {
    key: 'taobaoId',
    label: '淘宝_ID',
    aliases: ['淘宝_ID', '淘宝(平台)_ID', '淘宝ID', 'taobao_id'],
  },
  {
    key: 'xiaohongshuId',
    label: '小红书_ID',
    aliases: ['小红书_ID', '小红书(平台)_ID', '小红书ID', 'xiaohongshu_id'],
  },
];

const aliasEntries = PLATFORM_TEMPLATES.flatMap(template =>
  template.aliases.map(alias => ({ key: template.key, alias: alias.toLowerCase() }))
);

export function buildPlatformRemark(fields: PlatformFields): string {
  return PLATFORM_TEMPLATES
    .map(template => {
      const value = normalizeNullableText(fields[template.key]);
      return value ? `${template.label}: ${value}` : null;
    })
    .filter((line): line is string => !!line)
    .join('\n');
}

export function parsePlatformRemark(text: string): Required<PlatformFields> {
  const result: Required<PlatformFields> = {
    xianyuId: null,
    taobaoId: null,
    xiaohongshuId: null,
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const matched = line.match(/^([^:：]+)\s*[:：]\s*(.*)$/);
    if (!matched) {
      continue;
    }

    const label = matched[1].trim().toLowerCase();
    const value = normalizeNullableText(matched[2]);
    const alias = aliasEntries.find(entry => entry.alias === label);
    if (alias) {
      result[alias.key] = value;
    }
  }

  return result;
}

export function appendPlatformTemplate(text: string, key: PlatformFieldKey): string {
  const template = PLATFORM_TEMPLATES.find(item => item.key === key);
  if (!template) {
    return text;
  }

  const existingLines = text.split(/\r?\n/);
  const hasTemplate = existingLines.some(line => {
    const label = line.split(/[:：]/)[0]?.trim().toLowerCase();
    return !!label && template.aliases.some(alias => alias.toLowerCase() === label);
  });

  if (hasTemplate) {
    return text;
  }

  const prefix = text.trimEnd();
  return prefix ? `${prefix}\n${template.label}: ` : `${template.label}: `;
}

function normalizeNullableText(value: string | null | undefined): string | null {
  if (!value || !value.trim()) {
    return null;
  }

  return value.trim();
}
