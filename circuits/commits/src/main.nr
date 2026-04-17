use dep::poseidon::poseidon::bn254;

fn main(board: [Field; 25]) -> pub Field {
    let mut chunk_a = [0; 16];
    for i in 0..16 {
        chunk_a[i] = board[i];
    }

    let mut chunk_b = [0; 9];
    for i in 0..9 {
        chunk_b[i] = board[16 + i];
    }

    let h_a = bn254::hash_16(chunk_a);
    let h_b = bn254::hash_9(chunk_b);

    bn254::hash_2([h_a, h_b])
}
