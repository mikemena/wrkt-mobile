export const initialState = {
  theme: 'dark',
  accentColor: '#D93B56' //red
};

export function themeReducer(state, action) {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_ACCENT_COLOR':
      return { ...state, accentColor: action.payload };
    default:
      return state;
  }
}
