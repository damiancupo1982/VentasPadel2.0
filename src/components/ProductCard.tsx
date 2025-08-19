import React from 'react';
import { Plus, Minus, Package, Coffee, Zap } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  quantity?: number;
  onAdd?: (quantity: number) => void;
  onRemove?: () => void;
  onUpdateQuantity?: (quantity: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantity = 0,
  onAdd,
  onRemove,
  onUpdateQuantity
}) => {
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock < 5;
  
  const getCategoryIcon = () => {
    switch (product.category.toLowerCase()) {
      case 'bebidas': return <Coffee className="h-5 w-5 text-brown-500" />;
      case 'snacks': return <Package className="h-5 w-5 text-orange-500" />;
      case 'deportes': return <Zap className="h-5 w-5 text-blue-500" />;
      default: return <Package className="h-5 w-5 text-gray-400" />;
    }
  };
  
  const handleDecrease = () => {
    if (quantity > 1) {
      onUpdateQuantity?.(quantity - 1);
    } else {
      onRemove?.();
    }
  };

  const handleIncrease = () => {
    if (product.stock > quantity) {
      if (quantity === 0) {
        onAdd?.(1);
      } else {
        onUpdateQuantity?.(quantity + 1);
      }
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
      isOutOfStock ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:border-green-300'
    } hover:shadow-lg`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {getCategoryIcon()}
            <div className="ml-2" />
            <h3 className="font-medium text-gray-900">{product.name}</h3>
          </div>
          <div className="flex items-center space-x-1">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isOutOfStock ? 'bg-red-100 text-red-800' :
              isLowStock ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {product.stock} u
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">{product.category}</span>
          <span className="text-lg font-bold text-green-600">${product.price}</span>
        </div>
        
        {quantity === 0 ? (
          <button
            onClick={() => handleIncrease()}
            disabled={isOutOfStock}
            className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium transition-all shadow-sm ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 active:from-green-800 active:to-green-900 hover:shadow-md'
            }`}
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <button
              onClick={handleDecrease}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-all shadow-sm hover:shadow-md"
            >
              <Minus className="h-4 w-4" />
            </button>
            
            <span className="text-lg font-semibold text-green-600 px-3">
              {quantity}
            </span>
            
            <button
              onClick={handleIncrease}
              disabled={product.stock <= quantity}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all shadow-sm ${
                product.stock <= quantity
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-100 text-green-600 hover:bg-green-200 hover:shadow-md'
              }`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;