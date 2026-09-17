import { searchIndex } from "@/lib/data/search"

// 검색을 한 번도 열지 않는 방문자의 초기 HTML에 전체 아티클 본문이 실리지 않도록(server-serialization),
// 헤더 검색을 실제로 열 때만 클라이언트가 이 라우트를 fetch해 인덱스를 받아온다. 콘텐츠는 빌드 시점에만
// 바뀌므로 요청마다 다시 계산할 이유가 없어 force-static으로 빌드 타임에 1회 굽는다.
export const dynamic = "force-static"

export function GET() {
  return Response.json(searchIndex)
}
