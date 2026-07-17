import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <View 
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
