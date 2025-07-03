import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/lib/api';

// If you have types, import them. Otherwise, use 'any' for now.
// import { Organization, Invitation } from '@/types';
type Organization = any;
type Invitation = any;

interface OrganizationsState {
  organizations: Organization[];
  activeOrganization: Organization | null;
  actingAsOrganizationId: string | null;
  isLoading: boolean;
  error: string | null;
  organizationInvitations: Invitation[];
  isLoadingInvitations: boolean;
}

const initialState: OrganizationsState = {
  organizations: [],
  activeOrganization: null,
  actingAsOrganizationId: null,
  isLoading: false,
  error: null,
  organizationInvitations: [],
  isLoadingInvitations: false,
};

export const loadOrganizations = createAsyncThunk<Organization[]>('organizations/loadOrganizations', async (_, thunkAPI) => {
  try {
    const organizations = await apiClient.getOrganizations();
    return organizations;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const createOrganization = createAsyncThunk<Organization, any>('organizations/createOrganization', async (data, thunkAPI) => {
  try {
    const newOrg = await apiClient.createOrganization(data);
    return newOrg;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const updateOrganization = createAsyncThunk<Organization, { id: string, data: any }>('organizations/updateOrganization', async ({ id, data }, thunkAPI) => {
  try {
    const updatedOrg = await apiClient.updateOrganization(id, data);
    return updatedOrg;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const deleteOrganization = createAsyncThunk<string, string>('organizations/deleteOrganization', async (id, thunkAPI) => {
  try {
    await apiClient.deleteOrganization(id);
    return id;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

// Invitation thunks
type InvitationThunkArg = { organizationId: string; invitationId: string };

export const loadOrganizationInvitations = createAsyncThunk<Invitation[], string>('organizations/loadOrganizationInvitations', async (organizationId, thunkAPI) => {
  try {
    const invitations = await apiClient.getOrganizationInvitations(organizationId);
    return invitations;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const resendInvitation = createAsyncThunk<Invitation, InvitationThunkArg>('organizations/resendInvitation', async ({ organizationId, invitationId }, thunkAPI) => {
  try {
    const updatedInvitation = await apiClient.resendInvitation(organizationId, invitationId);
    return updatedInvitation;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

export const cancelInvitation = createAsyncThunk<string, InvitationThunkArg>('organizations/cancelInvitation', async ({ organizationId, invitationId }, thunkAPI) => {
  try {
    await apiClient.cancelInvitation(organizationId, invitationId);
    return invitationId;
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message);
  }
});

// Invite member thunk
export const inviteMember = createAsyncThunk<Invitation, { organizationId: string; email: string; role: string }>(
  'organizations/inviteMember',
  async ({ organizationId, email, role }, thunkAPI) => {
    try {
      const invitation = await apiClient.createInvitation(organizationId, { email, role });
      return invitation;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const organizationsSlice = createSlice({
  name: 'organizations',
  initialState,
  reducers: {
    setActiveOrganization(state, action: PayloadAction<Organization | null>) {
      state.activeOrganization = action.payload;
    },
    setActingAsOrganization(state, action: PayloadAction<string | null>) {
      state.actingAsOrganizationId = action.payload;
    },
    clearActingAsOrganization(state) {
      state.actingAsOrganizationId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadOrganizations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadOrganizations.fulfilled, (state, action: PayloadAction<Organization[]>) => {
        state.isLoading = false;
        state.organizations = action.payload;
        if (!state.activeOrganization && action.payload.length > 0) {
          state.activeOrganization = action.payload[0];
        }
      })
      .addCase(loadOrganizations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string | null;
      })
      .addCase(createOrganization.fulfilled, (state, action: PayloadAction<Organization>) => {
        state.organizations.push(action.payload);
        if (state.organizations.length === 1) {
          state.activeOrganization = action.payload;
        }
      })
      .addCase(updateOrganization.fulfilled, (state, action: PayloadAction<Organization>) => {
        state.organizations = state.organizations.map(org => org.id === action.payload.id ? action.payload : org);
        if (state.activeOrganization && state.activeOrganization.id === action.payload.id) {
          state.activeOrganization = action.payload;
        }
      })
      .addCase(deleteOrganization.fulfilled, (state, action: PayloadAction<string>) => {
        state.organizations = state.organizations.filter(org => org.id !== action.payload);
        if (state.activeOrganization && state.activeOrganization.id === action.payload) {
          state.activeOrganization = state.organizations[0] || null;
        }
      })
      // Invitation reducers
      .addCase(loadOrganizationInvitations.pending, (state) => {
        state.isLoadingInvitations = true;
      })
      .addCase(loadOrganizationInvitations.fulfilled, (state, action: PayloadAction<Invitation[]>) => {
        state.isLoadingInvitations = false;
        state.organizationInvitations = action.payload;
      })
      .addCase(loadOrganizationInvitations.rejected, (state) => {
        state.isLoadingInvitations = false;
      })
      .addCase(resendInvitation.fulfilled, (state, action: PayloadAction<Invitation>) => {
        state.organizationInvitations = state.organizationInvitations.map(inv => inv.id === action.payload.id ? action.payload : inv);
      })
      .addCase(cancelInvitation.fulfilled, (state, action: PayloadAction<string>) => {
        state.organizationInvitations = state.organizationInvitations.filter(inv => inv.id !== action.payload);
      })
      .addCase(inviteMember.fulfilled, (state, action: PayloadAction<Invitation>) => {
        state.organizationInvitations.push(action.payload);
      });
  },
});

export const { setActiveOrganization, setActingAsOrganization, clearActingAsOrganization } = organizationsSlice.actions;
export default organizationsSlice.reducer; 