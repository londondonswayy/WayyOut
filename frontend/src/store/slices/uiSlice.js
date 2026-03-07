import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: false,
    reservationModal: { open: false, venue: null },
    aiChatOpen: false,
    userLocation: null,
  },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    openReservationModal: (state, action) => { state.reservationModal = { open: true, venue: action.payload }; },
    closeReservationModal: (state) => { state.reservationModal = { open: false, venue: null }; },
    toggleAIChat: (state) => { state.aiChatOpen = !state.aiChatOpen; },
    setUserLocation: (state, action) => { state.userLocation = action.payload; },
  },
});

export const { toggleSidebar, openReservationModal, closeReservationModal, toggleAIChat, setUserLocation } = uiSlice.actions;
export default uiSlice.reducer;
