use dep::poseidon::poseidon::bn254;
fn hash_board(board: [Field; 25]) -> Field {
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

fn main(
    board: [Field; 25],
    board_commitment: pub Field,
    guess_x: pub u8,
    guess_y: pub u8,
) -> pub Field {
    for i in 0..25 {
        let cell = board[i];
        assert(cell * (cell - 1) == 0);
    }

    let computed_hash = hash_board(board);
    assert(computed_hash == board_commitment);

    assert(guess_x < 5);
    assert(guess_y < 5);

    let index: Field = (guess_y as Field) * 5 + (guess_x as Field);

    let mut result: Field = 0;
    for i in 0..25 {
        if index == i as Field {
            result = board[i];
        }
    }

    result
}
