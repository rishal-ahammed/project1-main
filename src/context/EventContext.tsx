import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Event, EventContextType, User } from '../types';
import { supabase } from '../lib/supabase';

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<User[]>([]);
  
  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
    fetchRegistrations();
  }, []);
  
  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching events:', error);
      return;
    }
    
    setEvents(data || []);
  };
  
  const fetchRegistrations = async () => {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching registrations:', error);
      return;
    }
    
    setRegistrations(data || []);
  };
  
  const addEvent = async (event: Omit<Event, 'id' | 'registrationCount' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('events')
      .insert([{
        ...event,
        registration_count: 0,
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding event:', error);
      return;
    }
    
    setEvents([data, ...events]);
  };
  
  const updateEvent = async (updatedEvent: Event) => {
    const { error } = await supabase
      .from('events')
      .update({
        title: updatedEvent.title,
        description: updatedEvent.description,
        date: updatedEvent.date,
        location: updatedEvent.location,
        capacity: updatedEvent.capacity,
        registration_count: updatedEvent.registrationCount,
        image_url: updatedEvent.imageUrl,
      })
      .eq('id', updatedEvent.id);
    
    if (error) {
      console.error('Error updating event:', error);
      return;
    }
    
    setEvents(events.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    ));
  };
  
  const removeEvent = async (id: string) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error removing event:', error);
      return;
    }
    
    setEvents(events.filter(event => event.id !== id));
    setRegistrations(registrations.filter(reg => reg.eventId !== id));
  };
  
  const getEvent = (id: string) => {
    return events.find(event => event.id === id);
  };
  
  const registerUser = async (userData: Omit<User, 'id' | 'registrationDate'>) => {
    const eventId = userData.eventId;
    const event = getEvent(eventId);
    
    if (!event) return false;
    
    // Check if there are available spots
    const { available } = getAvailableSpots(eventId);
    if (available <= 0) return false;
    
    // Create new registration
    const { data: registration, error: registrationError } = await supabase
      .from('registrations')
      .insert([{
        event_id: eventId,
        name: userData.name,
        phone: userData.phone,
        location: userData.location,
      }])
      .select()
      .single();
    
    if (registrationError) {
      console.error('Error creating registration:', registrationError);
      return false;
    }
    
    // Update event registration count
    const { error: updateError } = await supabase
      .from('events')
      .update({ registration_count: event.registrationCount + 1 })
      .eq('id', eventId);
    
    if (updateError) {
      console.error('Error updating event count:', updateError);
      return false;
    }
    
    // Update local state
    setRegistrations([...registrations, registration]);
    setEvents(events.map(e => 
      e.id === eventId 
        ? { ...e, registrationCount: e.registrationCount + 1 }
        : e
    ));
    
    return true;
  };
  
  const getRegistrationsForEvent = (eventId: string) => {
    return registrations.filter(user => user.eventId === eventId);
  };
  
  const setEventCapacity = async (eventId: string, capacity: number) => {
    const { error } = await supabase
      .from('events')
      .update({ capacity })
      .eq('id', eventId);
    
    if (error) {
      console.error('Error updating capacity:', error);
      return;
    }
    
    setEvents(events.map(event => 
      event.id === eventId ? { ...event, capacity } : event
    ));
  };
  
  const getAvailableSpots = (eventId: string) => {
    const event = getEvent(eventId);
    if (!event) return { available: 0, total: 0 };
    
    return {
      available: Math.max(0, event.capacity - event.registrationCount),
      total: event.capacity,
    };
  };
  
  return (
    <EventContext.Provider
      value={{
        events,
        registrations,
        addEvent,
        updateEvent,
        removeEvent,
        getEvent,
        registerUser,
        getRegistrationsForEvent,
        setEventCapacity,
        getAvailableSpots,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};