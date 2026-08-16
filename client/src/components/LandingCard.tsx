import { useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';

import { NameInput } from '@/components/NameInput';
import { useAppContext } from '@/hooks/useAppContext';
import { socketService } from '@/services/socketService';

const MAX_NAME_LENGTH = 30;
const ROOM_ID_PATTERN = /^\d{4}$/u;

type RoomResponse =
  { readonly ok: true; readonly roomId: string } | { readonly ok: false; readonly message: string };

const validateName = (name: string): string => {
  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return 'Name cannot be empty.';
  }

  if (trimmedName.length > MAX_NAME_LENGTH) {
    return `Name cannot be longer than ${String(MAX_NAME_LENGTH)} characters.`;
  }

  return '';
};

const validateRoomId = (roomId: string): string => {
  if (!ROOM_ID_PATTERN.test(roomId.trim())) {
    return 'Enter a 4-digit room ID.';
  }

  return '';
};

const emitWithConnection = async (
  socket: ReturnType<typeof useAppContext>['socket'],
  emitRoomEvent: () => void
): Promise<void> => {
  if (socket.connected) {
    emitRoomEvent();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const handleConnect = (): void => {
      cleanup();
      resolve();
    };
    const handleError = (): void => {
      cleanup();
      reject(new Error('Unable to connect to the server.'));
    };
    const cleanup = (): void => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleError);
    };

    socket.once('connect', handleConnect);
    socket.once('connect_error', handleError);
    socketService.connect(socket);
  });

  emitRoomEvent();
};

interface SubmitEventLike {
  readonly preventDefault: () => void;
}

export const LandingCard = (): ReactElement => {
  const navigate = useNavigate();
  const { socket, setUsername, setRoomId, setConnectionStatus } = useAppContext();
  const [name, setName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [error, setError] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState('');

  const handleCreateRoom = async (): Promise<void> => {
    const validationError = validateName(name);

    if (validationError.length > 0) {
      setError(validationError);
      return;
    }

    setError('');
    setConnectionStatus('connecting');

    try {
      await emitWithConnection(socket, () => {
        socket.emit('room:create', { name: name.trim() }, (response: RoomResponse) => {
          if (!response.ok) {
            setError(response.message);
            setConnectionStatus('error');
            return;
          }

          setUsername(name.trim());
          setRoomId(response.roomId);
          setCreatedRoomId(response.roomId);
          setConnectionStatus('connected');
          void navigate('/editor');
        });
      });
    } catch {
      setError('Unable to connect to the server.');
      setConnectionStatus('error');
    }
  };

  const handleJoinRoom = async (): Promise<void> => {
    const validationError = validateName(name) || validateRoomId(roomIdInput);

    if (validationError.length > 0) {
      setError(validationError);
      return;
    }

    setError('');
    setConnectionStatus('connecting');

    try {
      await emitWithConnection(socket, () => {
        socket.emit(
          'room:join',
          { name: name.trim(), roomId: roomIdInput.trim() },
          (response: RoomResponse) => {
            if (!response.ok) {
              setError(response.message);
              setConnectionStatus('error');
              return;
            }

            setUsername(name.trim());
            setRoomId(response.roomId);
            setConnectionStatus('connected');
            void navigate('/editor');
          }
        );
      });
    } catch {
      setError('Unable to connect to the server.');
      setConnectionStatus('error');
    }
  };

  const handleSubmit = (event: SubmitEventLike): void => {
    event.preventDefault();
  };

  return (
    <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
          Realtime Collaborative Editor
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Create a room or join an existing room.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <NameInput
          value={name}
          error=""
          onChange={(value) => {
            setName(value);
            setError('');
          }}
        />

        <button
          type="button"
          onClick={() => {
            void handleCreateRoom();
          }}
          className="h-11 w-full rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create Room
        </button>

        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <span className="h-px flex-1 bg-slate-200" />
          OR
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Room ID</span>
          <input
            value={roomIdInput}
            onChange={(event) => {
              setRoomIdInput(event.target.value.replace(/\D/gu, '').slice(0, 4));
              setError('');
            }}
            inputMode="numeric"
            maxLength={4}
            placeholder="4821"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <button
          type="button"
          onClick={() => {
            void handleJoinRoom();
          }}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Join Room
        </button>

        {createdRoomId.length > 0 ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-800">
            <p className="font-semibold">Room Created!</p>
            <p>Room ID: {createdRoomId}</p>
          </div>
        ) : null}

        {error.length > 0 ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </section>
  );
};
