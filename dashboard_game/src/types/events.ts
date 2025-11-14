export interface EventItem {
  id: number;
  title: string;
  event_type: 'online' | 'offline';
  event_date: string;
  start_time: string;
  description: string;
  event_link?: string;
  show_button: boolean;
  button_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
  updated_by_name?: string;
}

export interface CreateEventData {
  title: string;
  event_type: 'online' | 'offline';
  event_date: string;
  start_time: string;
  description: string;
  event_link?: string;
  show_button: boolean;
  button_text: string;
  is_active: boolean;
}
