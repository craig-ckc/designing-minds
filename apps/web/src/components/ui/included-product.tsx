import { type Product } from '@designing-minds/cms'
import { Card } from './card'
import { Icon } from './icon';

export function IncludedProduct({ product }: { product: Pick<Product, 'title'> }) {
  return (
    <Card as="article" variant="surfaceAlt" pad="sm" className="p-2 rounded-lg flex gap-2">
      <span className="block h-6 w-6 flex-none transition-colors duration-300 text-primary">
        <Icon name={'doc'} />
      </span>
      <p className="font-semibold leading-snug text-ink text-body-sm">{product.title}</p>
    </Card>
  )
}
