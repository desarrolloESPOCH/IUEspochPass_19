export interface IResponse<T> {
  success: boolean;
  count: number;
  message: string;
  data: T[];
}
