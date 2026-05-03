import { getUserFavouritesAction } from '@/features/profile';
import FavouriteMovesGallery from '@/features/profile/components/FavouriteMovesGallery';
import { auth } from '@/shared/lib/auth';

export default async function FavouriteMovesPage() {
  const [favourites, session] = await Promise.all([getUserFavouritesAction(), auth()]);
  const firstName = session?.user?.name?.split(' ')[0] ?? null;
  return <FavouriteMovesGallery initialFavourites={favourites} userName={firstName} />;
}
