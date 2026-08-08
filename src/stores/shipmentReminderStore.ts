import { defineStore } from 'pinia';
import apiClient from '../services/api';

export interface ShipmentReminderSettings {
  enabled: boolean;
  smsEnabled: boolean;
  voiceEnabled: boolean;
  sendHour: number;
  sendMinute: number;
  voiceSendHour: number;
  voiceSendMinute: number;
  templateVariables: ShipmentReminderTemplateVariable[];
  smsSignName?: string | null;
  smsTemplateCode?: string | null;
  voiceTtsCode?: string | null;
  voiceCalledShowNumber?: string | null;
  administratorUserIds: string[];
  templateBody: string;
  aliyunCredentialsConfigured: boolean;
  updatedAt?: string;
  updatedBy?: string | null;
}

export interface AliyunSmsTemplate {
  templateCode: string;
  templateName?: string | null;
  templateContent?: string | null;
  signatureName?: string | null;
  auditStatus?: string | null;
  isApproved: boolean;
  matchesShipmentReminder: boolean;
  variableNames: string[];
}

export type ShipmentReminderVariableSource =
  | 'OrderIdWithRenterName'
  | 'RentalNumber'
  | 'RenterName'
  | 'RelativeExpectedShipDate'
  | 'ExpectedShipDate'
  | 'Creator'
  | 'Responsible'
  | 'StaticText';

export interface ShipmentReminderTemplateVariable {
  name: string;
  source: ShipmentReminderVariableSource;
  staticValue?: string | null;
}

export interface ShipmentReminderTestResult {
  userName: string;
  mobile: string;
  channel: 'Sms' | 'Voice';
  success: boolean;
  providerRequestId?: string | null;
  error?: string | null;
}

interface ShipmentReminderState {
  settings: ShipmentReminderSettings | null;
  smsTemplates: AliyunSmsTemplate[];
  loading: boolean;
}

export const useShipmentReminderStore = defineStore('shipmentReminder', {
  state: (): ShipmentReminderState => ({
    settings: null,
    smsTemplates: [],
    loading: false,
  }),
  actions: {
    async fetchSettings(): Promise<ShipmentReminderSettings> {
      this.loading = true;
      try {
        const response = await apiClient.get<ShipmentReminderSettings>('/shipment-reminder-settings');
        this.settings = response.data;
        return response.data;
      } finally {
        this.loading = false;
      }
    },

    async fetchSmsTemplates(): Promise<AliyunSmsTemplate[]> {
      const response = await apiClient.get<AliyunSmsTemplate[]>('/shipment-reminder-settings/sms-templates');
      this.smsTemplates = response.data;
      return response.data;
    },

    async updateSettings(payload: ShipmentReminderSettings): Promise<ShipmentReminderSettings> {
      this.loading = true;
      try {
        const response = await apiClient.put<ShipmentReminderSettings>('/shipment-reminder-settings', {
          enabled: payload.enabled,
          smsEnabled: payload.smsEnabled,
          voiceEnabled: payload.voiceEnabled,
          sendHour: Number(payload.sendHour),
          sendMinute: Number(payload.sendMinute),
          voiceSendHour: Number(payload.voiceSendHour),
          voiceSendMinute: Number(payload.voiceSendMinute),
          templateVariables: payload.templateVariables,
          smsTemplateCode: payload.smsTemplateCode || null,
          voiceTtsCode: payload.voiceTtsCode || null,
          voiceCalledShowNumber: payload.voiceCalledShowNumber || null,
          administratorUserIds: payload.administratorUserIds,
        });
        this.settings = response.data;
        return response.data;
      } finally {
        this.loading = false;
      }
    },

    async sendTest(payload: { userIds: string[]; sendSms: boolean; sendVoice: boolean }): Promise<ShipmentReminderTestResult[]> {
      const response = await apiClient.post<ShipmentReminderTestResult[]>('/shipment-reminder-settings/test', payload);
      return response.data;
    },
  },
});
