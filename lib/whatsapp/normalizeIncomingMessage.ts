export type NormalizedWhatsappIncomingMessage = {
  fromPhone: string;
  messageText: string;
  messageId?: string;
  timestamp?: string;
  source: "whatsapp";
};

export type WhatsappPayloadDiagnostics = {
  object?: string;
  entryCount: number;
  hasChanges: boolean;
  hasMessages: boolean;
  hasContacts: boolean;
  phoneNumberId?: string;
  messagesCount: number;
  contactsCount: number;
};

function textField(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function normalizeIncomingMessage(message: unknown): NormalizedWhatsappIncomingMessage | null {
  const record = asRecord(message);
  if (!record) return null;

  const type = textField(record.type);
  if (type !== "text") return null;

  const text = asRecord(record.text);
  const messageText = textField(text?.body);
  const fromPhone = textField(record.from);

  if (!fromPhone || !messageText) return null;

  return {
    fromPhone,
    messageText,
    messageId: textField(record.id) || undefined,
    timestamp: textField(record.timestamp) || undefined,
    source: "whatsapp",
  };
}

export function normalizeIncomingMessages(payload: unknown): NormalizedWhatsappIncomingMessage[] {
  const root = asRecord(payload);
  const entries = Array.isArray(root?.entry) ? root.entry : [];

  return entries.flatMap((entry) => {
    const entryRecord = asRecord(entry);
    const changes = Array.isArray(entryRecord?.changes) ? entryRecord.changes : [];

    return changes.flatMap((change) => {
      const changeRecord = asRecord(change);
      const value = asRecord(changeRecord?.value);
      const messages = Array.isArray(value?.messages) ? value.messages : [];

      return messages
        .map((message) => normalizeIncomingMessage(message))
        .filter((message): message is NormalizedWhatsappIncomingMessage => message !== null);
    });
  });
}

export function getWhatsappPayloadDiagnostics(payload: unknown): WhatsappPayloadDiagnostics {
  const root = asRecord(payload);
  const entries = Array.isArray(root?.entry) ? root.entry : [];
  let hasChanges = false;
  let hasMessages = false;
  let hasContacts = false;
  let phoneNumberId: string | undefined;
  let messagesCount = 0;
  let contactsCount = 0;

  for (const entry of entries) {
    const entryRecord = asRecord(entry);
    const changes = Array.isArray(entryRecord?.changes) ? entryRecord.changes : [];
    if (changes.length > 0) hasChanges = true;

    for (const change of changes) {
      const changeRecord = asRecord(change);
      const value = asRecord(changeRecord?.value);
      const metadata = asRecord(value?.metadata);
      const currentPhoneNumberId = textField(metadata?.phone_number_id);
      if (currentPhoneNumberId && !phoneNumberId) phoneNumberId = currentPhoneNumberId;

      const messages = Array.isArray(value?.messages) ? value.messages : [];
      const contacts = Array.isArray(value?.contacts) ? value.contacts : [];
      messagesCount += messages.length;
      contactsCount += contacts.length;
      if (messages.length > 0) hasMessages = true;
      if (contacts.length > 0) hasContacts = true;
    }
  }

  return {
    object: textField(root?.object) || undefined,
    entryCount: entries.length,
    hasChanges,
    hasMessages,
    hasContacts,
    phoneNumberId,
    messagesCount,
    contactsCount,
  };
}
