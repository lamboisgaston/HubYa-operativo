export type NormalizedWhatsappIncomingMessage = {
  fromPhone: string;
  messageText: string;
  messageId?: string;
  timestamp?: string;
  source: "whatsapp";
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
