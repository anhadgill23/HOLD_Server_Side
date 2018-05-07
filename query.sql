SELECT
symbol,
COALESCE(sum(CASE WHEN buy = TRUE THEN (price * amount) END),0) AS buy,
COALESCE(sum(CASE WHEN buy = FALSE THEN (price * amount) END),0) as sell,
(sum(CASE WHEN buy = TRUE THEN (amount) END) - COALESCE(sum(CASE WHEN buy = FALSE THEN (amount) END),0)) as remaining

FROM transactions
WHERE users_id = 2
GROUP BY symbol;