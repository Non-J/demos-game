import create, { State } from 'zustand';
import { persist } from 'zustand/middleware';

interface ClientState extends State {
  initState: boolean,
  username: string;
  server: string;

  setState: (new_state: Partial<ClientState>) => void;
}

const useClientState = create<ClientState>(persist(
  (set, get) => ({
    initState: true,
    username: '',
    server: 'http://localhost:9000',

    setState: (new_state: Partial<ClientState>) => set(state => new_state),
  }),
  {
    name: 'client-storage',
    getStorage: () => sessionStorage,
  },
));

export default useClientState;
