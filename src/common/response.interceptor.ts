import { Injectable, NestInterceptor, CallHandler } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

interface data<T> {
  data: T;
}

@Injectable()
export class ResponseInterceptor<T = any> implements NestInterceptor {
  intercept(context, next: CallHandler): Observable<data<T>> {
    return next.handle().pipe(
      map((data) => {
        /**
         * 如果我只返回了一个字符串，说明数据体部分并不重要，可以直接用 空对象 表示真值
         * 如果我返回的是一个对象，想要特殊的信息提示一定会在其中加入 message 属性，不想要提示的话此属性也没什么意义了
         */
        if (typeof data === 'string') {
          return {
            data: {},
            message: data,
            statusCode: 0,
          };
        } else if (Array.isArray(data)) {
          return {
            data,
            message: 'success',
            statusCode: 0,
          };
        } else if (typeof data === 'object' && data !== null) {
          const { message = 'success', ...other } = data;
          return {
            data: other,
            message,
            statusCode: 0,
          };
        } else {
          return {
            data,
            message: 'success',
            statusCode: 0,
          };
        }
      }),
    );
  }
}
