import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';

import { loadBackend as loadLHP } from "./src/back/index-LPH.js";
import { loadBackend as loadJJG } from "./src/back/index-JJG.js";
import { loadBackend as loadFMG } from "./src/back/index-FMG.js";


let PORT = process.env.PORT || 3000;
const app = express();

app.use("/", express.static("./static"));
app.use(bodyParser.json());

export function loadBackend(app) {
    loadLHP(app);
    loadJJG(app);
    loadFMG(app);
}

loadBackend(app);

// --- Iniciar Servidor ---
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});

app.get('/about', (req, res) => {
    res.sendFile(path.resolve('./static/about.html'));
});
