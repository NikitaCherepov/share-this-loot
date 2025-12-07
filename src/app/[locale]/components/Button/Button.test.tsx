import { render, screen, fireEvent } from '@testing-library/react'
import Button from './index'

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => {
    const translations: { [key: string]: string } = {
      add: 'Добавить',
      distribute: 'Распределить'
    }
    
    const t = (key: string) => translations[key] || key
    t.has = (key: string) => key in translations
    
    return t
  }
}))

describe('Button Component', () => {
  it('renders button with translated text', () => {
    const mockClick = jest.fn()
    
    render(<Button text="add" onClick={mockClick} />)
    
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Добавить')
  })

  it('renders button with non-translated text', () => {
    const mockClick = jest.fn()
    
    render(<Button text="Custom Text" onClick={mockClick} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveTextContent('Custom Text')
  })

  it('calls onClick when clicked', () => {
    const mockClick = jest.fn()
    
    render(<Button text="add" onClick={mockClick} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(mockClick).toHaveBeenCalledTimes(1)
  })

  it('applies custom styles', () => {
    const mockClick = jest.fn()
    
    render(
      <Button 
        text="add" 
        onClick={mockClick} 
        color="#FF0000" 
        maxWidth="100px"
        background="#00FF00"
      />
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveStyle('color: #FF0000')
    expect(button).toHaveStyle('max-width: 100px')
    expect(button).toHaveStyle('background: #00FF00')
  })

  it('sets correct button type', () => {
    const mockClick = jest.fn()
    
    render(<Button text="add" onClick={mockClick} type="submit" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
  })
})