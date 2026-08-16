/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_CLIENT_PORT: string;
  readonly VITE_PREVIEW_PORT: string;
  readonly VITE_SERVER_URL: string;
  readonly VITE_SOCKET_NAMESPACE: string;
  readonly VITE_YJS_ROOM_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
