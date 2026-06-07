/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOME_KEY: string;
  // more env variables...
}

declare module 'My/App' {
  declare const App: import('react').ComponentType;
  export default App;
}
