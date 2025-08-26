/**
 * Result Pattern for Error Handling
 * Eliminates throwing exceptions for business logic errors
 */

export abstract class Result<T> {
  abstract isSuccess(): boolean;
  abstract isFailure(): boolean;
  abstract getValue(): T;
  abstract getError(): string;

  static success<U>(value: U): Success<U> {
    return new Success(value);
  }

  static failure<U>(error: string): Failure<U> {
    return new Failure(error);
  }

  static combine<U>(results: Result<U>[]): Result<U[]> {
    const values: U[] = [];
    
    for (const result of results) {
      if (result.isFailure()) {
        return Result.failure(result.getError());
      }
      values.push(result.getValue());
    }
    
    return Result.success(values);
  }

  static async combineAsync<U>(results: Promise<Result<U>>[]): Promise<Result<U[]>> {
    const resolvedResults = await Promise.all(results);
    return Result.combine(resolvedResults);
  }

  map<U>(fn: (value: T) => U): Result<U> {
    if (this.isFailure()) {
      return Result.failure(this.getError());
    }
    try {
      return Result.success(fn(this.getValue()));
    } catch (error: any) {
      return Result.failure(error.message);
    }
  }

  flatMap<U>(fn: (value: T) => Result<U>): Result<U> {
    if (this.isFailure()) {
      return Result.failure(this.getError());
    }
    return fn(this.getValue());
  }

  async mapAsync<U>(fn: (value: T) => Promise<U>): Promise<Result<U>> {
    if (this.isFailure()) {
      return Result.failure(this.getError());
    }
    try {
      const result = await fn(this.getValue());
      return Result.success(result);
    } catch (error: any) {
      return Result.failure(error.message);
    }
  }

  match<U>(onSuccess: (value: T) => U, onFailure: (error: string) => U): U {
    if (this.isSuccess()) {
      return onSuccess(this.getValue());
    } else {
      return onFailure(this.getError());
    }
  }

  tap(fn: (value: T) => void): Result<T> {
    if (this.isSuccess()) {
      fn(this.getValue());
    }
    return this;
  }

  tapError(fn: (error: string) => void): Result<T> {
    if (this.isFailure()) {
      fn(this.getError());
    }
    return this;
  }

  get value(): T | null {
    return this.isSuccess() ? this.getValue() : null;
  }

  get error(): string {
    return this.isFailure() ? this.getError() : '';
  }
}

class Success<T> extends Result<T> {
  constructor(private readonly value: T) {
    super();
  }

  isSuccess(): boolean {
    return true;
  }

  isFailure(): boolean {
    return false;
  }

  getValue(): T {
    return this.value;
  }

  getError(): string {
    throw new Error('Cannot get error from success result');
  }
}

class Failure<T> extends Result<T> {
  constructor(private readonly error: string) {
    super();
  }

  isSuccess(): boolean {
    return false;
  }

  isFailure(): boolean {
    return true;
  }

  getValue(): T {
    throw new Error('Cannot get value from failure result');
  }

  getError(): string {
    return this.error;
  }
}