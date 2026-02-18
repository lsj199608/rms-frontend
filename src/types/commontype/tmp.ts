// 서버 응답 데이터의 타입을 정의합니다.
export interface testResponse {
  test1: number;
  test2: string;
  test3: string;
  test4: 'AAA' | 'BBB'; // 특정 문자열만 허용하도록 정의 가능
}

// 요청 데이터 타입 정의
export interface testRequest {
  test1: string;
  test2: string;
}