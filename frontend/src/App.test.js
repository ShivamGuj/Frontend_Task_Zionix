// src/App.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('App Component', () => {
  it('should handle input and add items to cart', async () => {
    axios.get.mockResolvedValue({ data: {/* mock data */} });

    render(<App />);

    // Input values
    fireEvent.change(screen.getByPlaceholderText('Enter the Part Number'), { target: { value: 'CC0402KRX7R7BB104' } });
    fireEvent.change(screen.getByPlaceholderText('Enter the Volume'), { target: { value: 20000 } });

    // Add to cart
    fireEvent.click(screen.getByText('ADD TO CART'));

    // Assert the item is in the cart
    expect(screen.getByText('CC0402KRX7R7BB104')).toBeInTheDocument();
    expect(screen.getByText('20000')).toBeInTheDocument();
  });
});
