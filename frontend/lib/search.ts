interface SearchRequest {
  query: string;
}

interface SearchResponse {
  query: string;
  query_intent: string;
  total_results: number;
  results: SearchResult[];
  took: number;
}

interface SearchResult {
  artifact_id: string;
  case_id: string;
  device_id: string;
  file_type: string;
  app: string;
  data_type: string;
  source_path: string;
  timestamp: string;
  conversion_timestamp: string;
  message?: string;
  title?: string;
  body?: string;
  text?: string;
  transcription?: string;
  sender?: string;
  recipient?: string;
  from?: string;
  to?: string;
  display_from?: string;
  display_to?: string;
  caller?: string;
  callee?: string;
  message_id?: string;
  thread_id?: string;
  direction?: string;
  message_direction?: string;
  message_type?: string;
  channel?: string;
  platform?: string;
  service?: string;
  conversation_name?: string;
  sending_party?: string;
  sending_party_jid?: string;
  phone_number?: string;
  email?: string;
  username?: string;
  display_name?: string;
  contact_name?: string;
  participants?: string[];
  account_name?: string;
  account_type?: string;
  url?: string;
  host?: string;
  domain?: string;
  search_term?: string;
  browser?: string;
  referrer?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  address?: string;
  place?: string;
  country?: string;
  city?: string;
  country_iso?: string;
  message_latitude?: number;
  message_longitude?: number;
  call_duration?: number;
  call_type?: string;
  call_direction?: string;
  call_date?: string;
  call_start_timestamp?: string;
  call_end_timestamp?: string;
  media_type?: string;
  filename?: string;
  file_size?: number;
  package_name?: string;
  app_name?: string;
  app_package_name?: string;
  package_id?: string;
  version?: string;
  status?: string | number;
  category?: string;
  notification_type?: string;
  event_type?: string;
  usage_type?: string;
  time_active_in_secs?: number;
  last_time_active?: string;
  types?: string;
  amount?: number;
  currency?: string;
  transaction_id?: string;
  payment_method?: string;
  bank_name?: string;
  account_number?: string;
  "device_battery_(%)"?: number;
  charging?: boolean;
  "speed_(mps)"?: number;
  course?: number;
  device_type?: string;
  pace?: number;
  elevation_gain?: number;
  possible_rssi?: number;
  authtoken?: string;
  authtoken_type?: string;
  password?: string;
  last_password_entry?: string;
  source_file?: string;
  originating_file?: string;
  apk_path?: string;
  data?: string;
  value?: string;
  key?: string;
  calendar_name?: string;
  calendar_display_name?: string;
  user?: string;
  owner_account?: string;
  holder?: string;
  role?: string;
  access_count?: number;
  deleted?: boolean;
  visible?: boolean;
  is_primary?: boolean;
  is_system_message?: boolean;
  message_is_hidden?: boolean;
  message_is_read?: boolean;
  read_status?: string;
  message_read?: boolean;
  message_timestamp?: string;
  debug_time?: string;
  creation_timestamp?: string;
  last_updated_timestamp?: string;
  duration?: number;
  record_id?: string;
  source?: string;
  package?: string;
  id?: string;
  action_type?: string;
  alert_life_cycle_id?: string;
  cc?: string;
  name?: string;
  data_1?: string;
  hashes?: string;
  location?: string;
  entities?: string;
  tags?: string;
  notes?: string;
  languages?: string;
  status_timestamp?: string;
  notification_status?: string;
  positive_action?: string;
  negative_action?: string;
  post_timestamp?: string;
  when_timestamp?: string;
}

export interface EvidenceItem {
  id: string;
  app: string;
  timestamp: string;
  sender: string;
  tagBadges: string[];
  content: string;
  source: string;
  direction: "Incoming" | "Outgoing";
  file_type: string;
  artifact_id: string;
  case_id: string;
  device_id: string;
  device_info?: string | null;
  message_type?: string;
  conversation_name?: string;
  phone_number?: string | null;
  email?: string | null;
  jid?: string | null;
  status?: string;
  recovery_status?: string;
  raw_data?: SearchResult;
}

export async function searchQuery(query: string): Promise<{
  query: string;
  intent: string;
  results: EvidenceItem[];
  totalResults: number;
  processingTime: number;
}> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/search/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(
        `Search failed: ${response.status} ${response.statusText}`,
      );
    }

    const data: SearchResponse = await response.json();

    const evidenceItems: EvidenceItem[] = data.results.map((result, index) => {
      const appName =
        result.app_name ||
        result.app ||
        result.package_name?.split(".").pop()?.replace(/_/g, " ") ||
        result.file_type ||
        "Unknown App";

      const timestamp = new Date(result.timestamp).toLocaleString();

      const sender =
        result.sender ||
        result.display_from ||
        result.from ||
        result.caller ||
        result.sending_party ||
        result.contact_name ||
        result.display_name ||
        result.title ||
        "Unknown";

      const tagBadges: string[] = [];
      const content =
        result.message ||
        result.body ||
        result.text ||
        result.transcription ||
        "";

      if (
        content.toLowerCase().includes("crypto") ||
        content.toLowerCase().includes("bitcoin") ||
        content.toLowerCase().includes("ethereum") ||
        content.toLowerCase().includes("wallet")
      ) {
        tagBadges.push("Cryptocurrency");
      }
      if (content.includes("http") || content.includes("www.")) {
        tagBadges.push("External link");
      }
      if (
        content.toLowerCase().includes("money") ||
        content.toLowerCase().includes("payment") ||
        content.toLowerCase().includes("$") ||
        content.toLowerCase().includes("transaction")
      ) {
        tagBadges.push("Financial content");
      }
      if (
        content.toLowerCase().includes("group") ||
        content.toLowerCase().includes("join")
      ) {
        tagBadges.push("Group recruitment");
      }
      if (
        content.toLowerCase().includes("suspicious") ||
        content.toLowerCase().includes("scam")
      ) {
        tagBadges.push("Suspicious content");
      }
      if (content.includes("wa.me") || content.includes("whatsapp.com")) {
        tagBadges.push("WhatsApp link");
      }
      if (result.deleted) {
        tagBadges.push("Deleted content");
      }
      if (result.message_type === "image" || result.media_type === "image") {
        tagBadges.push("Image attachment");
      }

      const direction: "Incoming" | "Outgoing" =
        result.direction === "outgoing" ||
        result.message_direction === "outgoing" ||
        result.call_direction === "outgoing"
          ? "Outgoing"
          : "Incoming";

      const deviceInfo = result.device_type || null;

      const messageType = result.message_type || result.data_type || "Unknown";

      const conversationName = result.conversation_name || result.title || "";

      const phoneNumber = result.phone_number || null;
      const email = result.email || null;
      const jid = result.sending_party_jid || result.from || null;

      const status = result.deleted ? "Deleted" : "Active";
      const recoveryStatus = result.deleted ? "Recovered" : "Original";

      return {
        id: result.artifact_id,
        app: appName,
        timestamp,
        sender,
        tagBadges: tagBadges.length > 0 ? tagBadges : ["General message"],
        content:
          content.substring(0, 500) + (content.length > 500 ? "..." : ""),
        source: result.source_path || result.source || "Unknown source",
        direction,
        file_type: result.file_type,
        artifact_id: result.artifact_id,
        case_id: result.case_id,
        device_id: result.device_id,
        device_info: deviceInfo,
        message_type: messageType,
        conversation_name: conversationName,
        phone_number: phoneNumber,
        email: email,
        jid: jid,
        status: status,
        recovery_status: recoveryStatus,
        raw_data: result,
      };
    });

    return {
      query: data.query,
      intent: data.query_intent,
      results: evidenceItems,
      totalResults: data.total_results,
      processingTime: data.took,
    };
  } catch (error) {
    throw error;
  }
}
