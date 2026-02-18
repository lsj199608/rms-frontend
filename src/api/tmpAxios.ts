import api from './axios';
import { testRequest, testResponse} from '@/types/commontype/tmp';

/** * 제네릭 <UserResponse>를 사용하여 
 * 이 함수가 어떤 타입을 반환할지 TS에게 알려줍니다.
 */
export const tmpTest1 = (id: number) => {
  return api.get<testResponse>(`/test/tmpTest1/${id}`);
};

export const tmpTest2 = (data: testRequest) => {
  return api.post<string>('/test/tmpTest2', data); // 성공 시 토큰(string) 반환 가정
};