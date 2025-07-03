import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface UIState {
  notifications: Notification[];
  modals: {
    createOrganization: boolean;
    inviteMember: boolean;
  };
  confirmModal: {
    open: boolean;
    title?: string;
    message?: string;
    onConfirm?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
  };
}

const initialState: UIState = {
  notifications: [],
  modals: {
    createOrganization: false,
    inviteMember: false,
  },
  confirmModal: {
    open: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Notification>) {
      state.notifications.push(action.payload);
    },
    removeNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications(state) {
      state.notifications = [];
    },
    openModal(state, action: PayloadAction<'createOrganization' | 'inviteMember'>) {
      state.modals[action.payload] = true;
    },
    closeModal(state, action: PayloadAction<'createOrganization' | 'inviteMember'>) {
      state.modals[action.payload] = false;
    },
    openConfirmModal(state, action: PayloadAction<Omit<UIState['confirmModal'], 'open'> & { onConfirm?: () => void }>) {
      state.confirmModal = { ...action.payload, open: true };
    },
    closeConfirmModal(state) {
      state.confirmModal = { open: false };
    },
    setConfirmModalLoading(state, action: PayloadAction<boolean>) {
      state.confirmModal.loading = action.payload;
    },
  },
});

export const { addNotification, removeNotification, clearNotifications, openModal, closeModal, openConfirmModal, closeConfirmModal, setConfirmModalLoading } = uiSlice.actions;
export default uiSlice.reducer;