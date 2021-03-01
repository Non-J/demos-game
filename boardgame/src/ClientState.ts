import create, { State } from 'zustand';
import { persist } from 'zustand/middleware';
import { LobbyClient } from 'boardgame.io/client';
import { Demos } from './Demos';
import type { Game, LobbyAPI } from 'boardgame.io';

export const defaultServer: string = 'http://localhost:9000';
export const game: Game = Demos;
export const gameName: string = game.name ?? '';

export interface RoomData extends LobbyAPI.Match {
  nextEmptySeat: number | undefined,
  isAlreadyJoined: boolean,
}

interface ClientState extends State {
  initState: boolean;
  clearInitStateFlag: () => void;

  username: string;
  setUsername: (_username: string) => void;

  server: string;
  setServer: (_server: string) => void;

  roomID?: string;
  playerID?: number;
  credentials?: string;

  // Note: These actions may cause race-condition as they read from ClientState but does not lock.
  // However, in practice, these should not be called fast enough to trigger the bugs.
  createRoom: (numPlayers: number, setupData?: any, unlisted?: boolean) => Promise<void>;
  joinRoom: (roomID: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  getRoomData: (roomID?: string) => Promise<RoomData | null>;
}

const useClientState = create<ClientState>(persist(
  (set, get) => ({
    initState: true,
    clearInitStateFlag: () => set({
      initState: false,
    }),

    username: '',
    setUsername: (_username) => set({
      username: _username,
    }),

    server: defaultServer,
    setServer: (_server) => set({
      server: _server,
    }),

    createRoom: async (numPlayers: number, setupData?: any, unlisted: boolean = false) => {
      const state = get();
      const lobbyClient = new LobbyClient({ server: state.server });

      // Try to leave existing room
      if (state.roomID) {
        await state.leaveRoom();
      }

      // Join room. matchID unpacked from promise
      const { matchID } = await lobbyClient.createMatch(gameName, {
        numPlayers: numPlayers,
        setupData: setupData,
        unlisted: unlisted,
      });

      set({ roomID: matchID });
    },

    joinRoom: async (roomID: string) => {
      const state = get();
      const lobbyClient = new LobbyClient({ server: state.server });

      // Reconcile if trying to join roomID while another roomID is in the state
      if (state.roomID !== roomID) {
        await state.leaveRoom();
        set({ roomID: roomID });
        state.roomID = roomID;
      }

      let roomData = await state.getRoomData(roomID);

      if (roomData?.isAlreadyJoined === false && roomData?.nextEmptySeat !== undefined) {
        let credential = await lobbyClient.joinMatch(gameName, roomID, {
          playerID: roomData.nextEmptySeat.toString(),
          playerName: state.username,
        });
        set({ playerID: roomData.nextEmptySeat, credentials: credential.playerCredentials });
      }
    },

    leaveRoom: async () => {
      const state = get();
      const lobbyClient = new LobbyClient({ server: state.server });

      if (state.roomID !== undefined && state.playerID !== undefined && state.credentials !== undefined) {
        try {
          await lobbyClient.leaveMatch(gameName, state.roomID, {
            playerID: state.playerID.toString(),
            credentials: state.credentials,
          });
        } catch {
        }
      }

      set({ roomID: undefined, activePlayer: undefined });
    },

    getRoomData: async (roomID) => {
      const state = get();
      const lobbyClient = new LobbyClient({ server: state.server });

      const queryRoomID = roomID ?? state.roomID;
      if (!queryRoomID) {
        return null;
      }

      try {
        let response = await lobbyClient.getMatch(gameName, queryRoomID);
        return {
          ...response,
          nextEmptySeat: response?.players.find((p) => !p.name)?.id,
          isAlreadyJoined: response?.players.find((p) => {
            return p.id === state.playerID && p.name === state.username;
          }) !== undefined,
        };
      } catch {
        return null;
      }
    },
  }),
  {
    name: 'client-storage',
    getStorage: () => sessionStorage,
  },
));

export default useClientState;
