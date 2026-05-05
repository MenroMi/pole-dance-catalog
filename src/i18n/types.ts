import pl from './messages/pl.json';

type Messages = typeof pl;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Messages {}
}
