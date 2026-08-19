// Shared types for the automation system
export type ButtonAction = "web_url" | "postback"

/**
 * Where a web_url button's destination came from. Kept alongside the url so a
 * Kunfupay product stays recognisable as one after insertion instead of
 * degrading into an anonymous link — the UI renders it as a product row, and
 * a future sync could refresh a stale checkout URL.
 */
export interface ButtonProduct {
  id: string
  name: string
  price: number
  currency: string
  free?: boolean
}

export interface ProButton {
  id: string
  type: ButtonAction
  title: string
  url?: string
  payload?: string
  product?: ButtonProduct
}

export interface QuickReplyOption {
  id: string
  title: string
  payload?: string
}

export interface MediaResponse {
  type: "image" | "video" | "audio"
  url: string
}

// The JSON stored in automations.response_content
export interface ResponseContent {
  message?: string
  card?: {
    title: string
    subtitle?: string
    image_url?: string
    buttons: Omit<ProButton, "id">[]
  }
  media?: MediaResponse
  quick_replies?: { title: string; payload?: string }[]
  check_follow?: boolean
  // Comment automation options
  reply_mode?: "both" | "dm_only" | "public_only"
  public_replies?: string[]
  include_replies?: boolean
  // Delivery options
  delay_seconds?: number
  typing_indicator?: boolean
  mark_seen?: boolean
}

export interface MediaItem {
  id: string
  media_id: string
  media_type: string
  caption: string
  image_url: string
  video_url: string
  permalink: string
  media_product_type: string
  timestamp: string
}

export interface MediaSelection {
  reel_id: string
  caption?: string
}

export interface Automation {
  id: string
  name: string
  trigger_source: "comment" | "dm" | "story"
  trigger_value: string
  trigger_type: "keyword" | "postback" | "reply_all" | "mention" | "reaction" | "reply"
  response_content: ResponseContent
  is_active: boolean
  created_at: string
  specific_media_id?: string | null
  media_selection?: MediaSelection | null
  selected_reel_id?: string | null
}
