-- One-time patch: update existing player_cards whose card_data still has
-- index 12 as is_free_space:true (pre-May-2026 cards).
-- Changes index 12 cell to is_referral_free:true, is_free_space:false,
-- deed_text:'Refer a Player' to match the new card generation logic.

UPDATE player_cards
SET card_data = (
  SELECT jsonb_agg(
    CASE
      WHEN (cell->>'index')::int = 12 AND (cell->>'is_free_space')::boolean = true
      THEN cell
        - 'is_free_space'
        - 'deed_text'
        - 'deed_text_long'
        || jsonb_build_object(
            'is_free_space',    false,
            'is_referral_free', true,
            'deed_text',        'Refer a Player',
            'deed_text_long',   'Invite a friend to play! Submit a valid referral and this square marks itself complete.',
            'deed_id',          null,
            'quantity',         1
           )
      ELSE cell
    END
    ORDER BY (cell->>'index')::int
  )::text
  FROM jsonb_array_elements(card_data::jsonb) AS cell
)
WHERE card_data::jsonb @> '[{"index":12,"is_free_space":true}]';
