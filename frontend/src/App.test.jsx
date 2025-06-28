import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Clean Oracle header', () => {
  render(<App />);
  const linkElement = screen.getByText(/Clean Oracle/i);
  expect(linkElement).toBeInTheDocument();
});
