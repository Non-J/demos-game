struct Player {
    coin: u64,
}

pub struct Master {
    turn: u64,
    players: Vec<Player>,
}

impl Master {
    pub fn new(turn: u64, players: Vec<Player>) -> Self {
        Master { turn, players }
    }

    pub fn add_player(&mut self) {
        let new_player = Player {
            coin: 10,
        };

        self.players.push(new_player);
    }
}
