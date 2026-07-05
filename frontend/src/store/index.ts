import { configureStore } from '@reduxjs/toolkit'
import dbReducer from './dbSlice'

export const store = configureStore({
  reducer: {
    db: dbReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
