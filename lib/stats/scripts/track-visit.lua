-- KEYS[1] = dedup 키 (visited:{date}:{ip})
-- KEYS[2] = 총 방문 키 (visits:total)
-- KEYS[3] = 일별 방문 키 (visits:daily:{date})
-- KEYS[4] = 쿨다운 키 (track-cooldown:{ip}:{slug}) — ARGV[3] == "0"이면 사용하지 않음
-- KEYS[5] = 조회수 키 (pageviews:{slug}) — ARGV[3] == "0"이면 사용하지 않음
-- ARGV[1] = dedup TTL(초)
-- ARGV[2] = 쿨다운 TTL(초)
-- ARGV[3] = "1"이면 쿨다운+조회수 증가도 수행, "0"이면 사이트 방문 dedup만 수행
--
-- GET으로 dedup 확인 후 조건부로 SET+INCR을 날리던 구간에 있던 레이스(동시 요청이 둘 다
-- dedup을 통과해 중복 카운트되는 문제)를, 스크립트 전체를 원자적으로 실행해 제거한다.
-- 쿨다운(SET NX)은 원래도 원자적이었지만 같은 스크립트에 묶어 이 요청의 모든 쓰기가
-- 예외 없이 원자적이라는 불변식을 유지한다.

if redis.call("GET", KEYS[1]) == false then
  redis.call("SET", KEYS[1], "1", "EX", ARGV[1])
  redis.call("INCR", KEYS[2])
  redis.call("INCR", KEYS[3])
end

if ARGV[3] == "1" then
  if redis.call("SET", KEYS[4], "1", "EX", ARGV[2], "NX") then
    redis.call("INCR", KEYS[5])
  end
end

return 1
