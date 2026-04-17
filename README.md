# WRECKED! ZK Battleship on Stellar

A trustless two player Battleship game on the Stellar blockchain where zero knowledge proofs guarantee honest gameplay. Players commit their board layouts as Poseidon hashes on chain. Every hit or miss response is backed by a ZK proof verified by a Soroban smart contract, making cheating mathematically impossible.

Built for the Stellar Residency.

```
Browser (React/TypeScript)
├── Game UI (5×5 grid, ship placement, turn based play)
├── NoirJS + bb.js (client side ZK proof generation via WASM)
└── Stellar SDK + Freighter (wallet connection, contract calls)
        │
        │  proof bytes + public inputs
        ▼
Stellar Network (Soroban)
├── UltraHonk Verifier Contract (verifies Noir ZK proofs on chain)
└── Wrecked Game Contract (game state, turns, calls verifier)
```

## How It Works

**Ship Placement** Each player places 5 ships on a 5×5 grid. The board is hashed using Poseidon over BN254 and the commitment is stored on chain. The actual positions stay secret in the player's browser.

**Attacking** The attacker picks a cell on the opponent's grid. This guess is recorded on chain via the game contract.

**Defending with ZK Proofs** The defender's browser automatically generates a zero knowledge proof that honestly reports hit or miss without revealing the board. The proof is verified on chain by the UltraHonk verifier contract.

**Victory** First player to land 5 hits wins.

## Tech Stack

| Layer             | Technology                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| ZK Circuits       | [Noir](https://noir-lang.org/)                                                                    |
| Proving Backend   | [Barretenberg](https://github.com/AztecProtocol/barretenberg) UltraHonk, runs in browser via WASM |
| Smart Contracts   | Rust / [Soroban SDK](https://developers.stellar.org/docs/build/smart-contracts/overview)          |
| On Chain Verifier | [UltraHonk Soroban Verifier](https://github.com/indextree/ultrahonk_soroban_contract)             |
| Frontend          | React + TypeScript + Vite + Tailwind                                                              |
| Wallet            | [Freighter](https://www.freighter.app/)                                                           |
| Network           | Stellar Localnet (Docker)                                                                         |

## Prerequisites

Install the following before you begin:

| Tool             | Install Guide                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| Rust             | [rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)                                              |
| Stellar CLI      | [stellar.org CLI docs](https://developers.stellar.org/docs/tools/cli/stellar-cli)                                   |
| Noir             | [noir-lang.org/docs/getting_started](https://noir-lang.org/docs/getting_started/quick_start)                        |
| Barretenberg     | [github.com/AztecProtocol/aztec-packages](https://github.com/AztecProtocol/aztec-packages/tree/master/barretenberg) |
| Node.js          | [nodejs.org](https://nodejs.org/) (v18+)                                                                            |
| Docker           | [docker.com/get-started](https://docs.docker.com/get-started/get-docker/)                                           |
| Freighter Wallet | [freighter.app](https://www.freighter.app/) (browser extension)                                                     |

After installing Rust, add the Soroban WASM target:

```bash
rustup target add wasm32v1-none
```

Pin the Noir and Barretenberg versions to ensure compatibility:

```bash
noirup -v 1.0.0-beta.15
bbup -v 0.87.0
```

## Setup and Run

### 1. Start Stellar Localnet

```bash
docker run --rm -it \
  -p 8000:8000 \
  --name stellar \
  stellar/quickstart:testing \
  --local \
  --limits unlimited \
  --enable-soroban-diagnostic-events
```

Wait until the container logs show it is ready. The `--limits unlimited` flag is required because the UltraHonk verifier is computationally heavy.

### 2. Configure Stellar CLI

```bash
stellar network add local \
  --rpc-url http://localhost:8000/soroban/rpc \
  --network-passphrase "Standalone Network ; February 2017"

stellar keys generate player1 --network local
stellar keys generate player2 --network local
```

### 3. Compile the Noir Circuits

```bash
cd circuits/battleship
nargo compile
cd ../..

cd circuits/commits
nargo compile
cd ../..
```

Generate the verification key for the battleship circuit:

```bash
bb write_vk_ultra_honk \
  -b ./circuits/battleship/target/battleship.json \
  -o ./circuits/battleship/target/vk
```

### 4. Build and Deploy the Verifier Contract

The verifier contract lives inside `contracts/wrecked-game`. Build it and deploy with your circuit's verification key. Refer to the [UltraHonk Soroban Verifier README](https://github.com/indextree/ultrahonk_soroban_contract) for exact deploy instructions.

Save the verifier contract ID from the deploy output.

### 5. Build and Deploy the Game Contract

```bash
cd contracts/wrecked-game/contracts/wrecked
stellar contract build --optimize

stellar contract deploy \
  --wasm target/wasm32v1-none/release/wrecked.wasm \
  --source player1 \
  --network local \
  -- \
  --verifier_address <VERIFIER_CONTRACT_ID> \
  --player1 $(stellar keys address player1)
```

Save the game contract ID from the deploy output.

### 6. Configure and Run the Frontend

```bash
cd client
npm install
```

Create a `.env` file in the `client` directory:

```env
VITE_GAME_CONTRACT_ID=<GAME_CONTRACT_ID>
VITE_RPC_URL=http://localhost:8000/soroban/rpc
VITE_NETWORK_PASSPHRASE="Standalone Network ; February 2017"
```

Copy the compiled circuit artifacts:

```bash
cp ../circuits/battleship/target/battleship.json src/noir/battleship.json
cp ../circuits/commits/target/commits.json src/noir/commits.json
```

Start the dev server:

```bash
npm run dev
```

### 7. Configure Freighter

Open the Freighter browser extension and add a custom network with RPC URL `http://localhost:8000/soroban/rpc` and network passphrase `Standalone Network ; February 2017`.

Import the player1 and player2 secret keys. You can retrieve them with:

```bash
stellar keys show player1
stellar keys show player2
```

### 8. Play

Open two browser windows. Use a separate Chrome profile or Incognito window for the second player so each window has a different Freighter account active.

**Player 1** connects wallet, creates a game, places 5 ships, and confirms.

**Player 2** connects wallet, joins the game, places 5 ships, and confirms.

Players alternate turns. The attacker clicks a cell on the enemy grid. The defender's browser automatically generates a ZK proof and submits it on chain. The proof is verified by the contract and the hit or miss result is revealed. First to 5 hits wins.

## How the ZK Circuit Works

The battleship circuit proves three things without revealing the board:

**Board integrity** The defender's secret board hashes to the commitment stored on chain. This prevents changing ship positions mid game.

**Honest response** The cell at the guessed coordinate is truthfully reported as hit (1) or miss (0).

**Valid board** Each cell is binary (0 or 1) and coordinates are in bounds (0 to 4).

The prover (defender's browser) knows the full board. The verifier (Soroban contract) only sees the commitment hash, the guess coordinates, and the hit or miss result. The board itself is never revealed.

## Residency Tracks

**ZK Track** On chain ZK proof verification for trustless hidden information gameplay.

**Gaming Track** Fully playable two player game with real time proof generation.

## Known Limitations

The UltraHonk verifier exceeds Stellar testnet compute limits, so the game runs on localnet with `--limits unlimited` only.

There is no staking mechanism in this version. XLM staking for matches is a natural extension but was not implemented.

There is no timeout or forfeit logic. If a player disconnects the game stalls.

Proof generation takes 3 to 8 seconds in browser depending on hardware. This is inherent to client side ZK proving.

Each game deploys a fresh contract instance. A factory pattern would be needed for running multiple concurrent games.

## Future Work

The biggest opportunity is improving the developer experience for building ZK applications on Stellar. The tooling gap between writing a Noir circuit and getting a verified proof on chain is significant. Better templates, scaffolding, and documentation for the circuit to contract pipeline would make ZK on Stellar much more accessible. Bridging the gap between Noir's proving system and Soroban's contract environment should not require as much manual wiring as it does today.

Beyond tooling, the game itself could grow with XLM staking and tournament modes, larger grids with multi cell ships, and a game factory contract for concurrent matches.

## Built With

[Noir](https://noir-lang.org/) zero knowledge circuit language by Aztec. [Barretenberg](https://github.com/AztecProtocol/barretenberg) UltraHonk proving system. [Soroban](https://soroban.stellar.org/) Stellar smart contract platform. [UltraHonk Soroban Verifier](https://github.com/indextree/ultrahonk_soroban_contract) on chain proof verification by IndexTree. [Freighter](https://www.freighter.app/) Stellar browser wallet. [React](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/).

## License

MIT
