import pl from './messages/pl.json';

type Messages = typeof pl;

declare global {
  interface IntlMessages extends Messages {}
}
