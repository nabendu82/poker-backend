const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

app.use(bodyParser.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
                .then(() => console.log('Connected to MongoDB'))
                .catch(err => console.error('Failed to connect to MongoDB', err));

const gameSchema = new mongoose.Schema({ players: Array });

const Game = mongoose.model('Game', gameSchema);

const determineWinner = players => {
    const getScore = (rolls) => {
        const counts = {};
        for (let roll of rolls) {
            counts[roll] = (counts[roll] || 0) + 1;
        }

        const values = Object.values(counts).sort((a, b) => b - a);
        if (values[0] === 5) return { score: 5, type: '5 of a kind' };
        if (values[0] === 4) return { score: 4, type: '4 of a kind' };
        if (values[0] === 3 && values[1] === 2) return { score: 3, type: 'Full House' };
        if (rolls.sort().join('') === '12345' || rolls.sort().join('') === '23456') return { score: 2, type: 'Straight' };
        if (values[0] === 3) return { score: 1, type: '3 of a kind' };
        if (values[0] === 2 && values[1] === 2) return { score: 1, type: 'Two Pair' };
        if (values[0] === 2) return { score: 0, type: 'Pair' };
        return { score: -1, type: 'None' };
    };

    let winner = { player: -1, score: -2, type: '', sum: 0 };
    players.forEach((player, index) => {
        const { score, type } = getScore(player);
        const sum = player.reduce((acc, val) => acc + val, 0);
        if (
            score > winner.score ||
            (score === winner.score && sum > winner.sum)
        ) {
            winner = { player: index + 1, score, type, sum };
        }
    });

    return `Winner is player ${winner.player} - ${winner.type}`;
};

app.post('/api/game', async (req, res) => {
    const { players } = req.body;

    const game = new Game({ players });
    await game.save();

    const result = determineWinner(players);
    res.status(200).json({ result });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
