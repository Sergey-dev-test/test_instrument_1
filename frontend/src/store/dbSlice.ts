import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { api } from '../services/api'

interface DBConnection {
  id: string
  name: string
  db_type: string
  host: string
  port: number
  database_name: string
  is_connected: boolean
}

interface DBState {
  connections: DBConnection[]
  activeConnection: DBConnection | null
  isLoading: boolean
  error: string | null
}

const initialState: DBState = {
  connections: [],
  activeConnection: null,
  isLoading: false,
  error: null
}

export const testConnection = createAsyncThunk(
  'db/testConnection',
  async (connectionData: any) => {
    const response = await api.post('/db/test-connection', connectionData)
    return response.data
  }
)

export const scanDatabase = createAsyncThunk(
  'db/scanDatabase',
  async (connectionId: string) => {
    const response = await api.post(`/db/scan/${connectionId}`)
    return response.data
  }
)

const dbSlice = createSlice({
  name: 'db',
  initialState,
  reducers: {
    setActiveConnection: (state, action) => {
      state.activeConnection = action.payload
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(testConnection.pending, (state) => {
        state.isLoading = true
      })
      .addCase(testConnection.fulfilled, (state, action) => {
        state.isLoading = false
        state.error = null
      })
      .addCase(testConnection.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Ошибка подключения'
      })
  }
})

export const { setActiveConnection, clearError } = dbSlice.actions
export default dbSlice.reducer
