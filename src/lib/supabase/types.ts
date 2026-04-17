export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserRole = "attendee" | "organizer" | "staff" | "admin";
export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type TicketStatus = "active" | "used" | "cancelled" | "refunded";
export type ValidationStatus = "valid" | "invalid" | "already_used";
export type ValidationMethod = "qr_scan" | "manual";
export type ResaleStatus = "active" | "sold" | "cancelled";
export type EscrowStatus = "pending" | "held" | "released" | "refunded";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
        };
        Update: {
          full_name?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
        };
      };
      events: {
        Row: {
          id: string;
          organizer_id: string;
          name: string;
          description: string | null;
          date: string;
          time: string;
          venue: string;
          city: string;
          country: string;
          category: string;
          image_url: string | null;
          status: EventStatus;
          sales_end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organizer_id: string;
          name: string;
          description?: string | null;
          date: string;
          time: string;
          venue: string;
          city: string;
          country?: string;
          category: string;
          image_url?: string | null;
          status?: EventStatus;
          sales_end_date?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          date?: string;
          time?: string;
          venue?: string;
          city?: string;
          category?: string;
          image_url?: string | null;
          status?: EventStatus;
          sales_end_date?: string | null;
        };
      };
      ticket_types: {
        Row: {
          id: string;
          event_id: string;
          name: string;
          description: string | null;
          price: number;
          total_available: number;
          sold_count: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          event_id: string;
          name: string;
          description?: string | null;
          price: number;
          total_available: number;
          sold_count?: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string | null;
          price?: number;
          total_available?: number;
          is_active?: boolean;
        };
      };
      tickets: {
        Row: {
          id: string;
          ticket_type_id: string;
          event_id: string;
          attendee_id: string;
          status: TicketStatus;
          purchase_price: number;
          qr_code: string;
          created_at: string;
        };
        Insert: {
          ticket_type_id: string;
          event_id: string;
          attendee_id: string;
          purchase_price: number;
          status?: TicketStatus;
        };
        Update: {
          status?: TicketStatus;
        };
      };
      ticket_validations: {
        Row: {
          id: string;
          ticket_id: string;
          event_id: string;
          validated_by: string | null;
          validation_time: string;
          validation_method: ValidationMethod;
          status: ValidationStatus;
        };
        Insert: {
          ticket_id: string;
          event_id: string;
          validated_by?: string | null;
          validation_method?: ValidationMethod;
          status: ValidationStatus;
        };
        Update: never;
      };
      resale_listings: {
        Row: {
          id: string;
          ticket_id: string;
          seller_id: string;
          original_price: number;
          resale_price: number;
          status: ResaleStatus;
          escrow_status: EscrowStatus;
          created_at: string;
        };
        Insert: {
          ticket_id: string;
          seller_id: string;
          original_price: number;
          resale_price: number;
          status?: ResaleStatus;
          escrow_status?: EscrowStatus;
        };
        Update: {
          resale_price?: number;
          status?: ResaleStatus;
          escrow_status?: EscrowStatus;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
