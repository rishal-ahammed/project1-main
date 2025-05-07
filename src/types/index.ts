export interface User {
  id: string;
  name: string;
  phone: string;
  location: string;
  eventId: string;
  registrationDate: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  registrationCount: number;
  imageUrl: string;
  createdAt: Date;
  userId: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          date: string;
          location: string;
          capacity: number;
          registration_count: number;
          image_url: string;
          created_at: string;
          user_id: string;
        };
        Insert: Omit<Event, 'id' | 'createdAt'>;
        Update: Partial<Omit<Event, 'id' | 'createdAt'>>;
      };
      registrations: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          name: string;
          phone: string;
          location: string;
          created_at: string;
        };
        Insert: Omit<User, 'id' | 'registrationDate'>;
        Update: Partial<Omit<User, 'id' | 'registrationDate'>>;
      };
    };
  };
}