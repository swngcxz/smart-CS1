// Test file for terms agreement utility functions
import { getTermsAgreement, setTermsAgreement, clearTermsAgreement } from '../termsAgreement';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Terms Agreement Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getTermsAgreement should return false when no agreement is saved', () => {
    localStorageMock.getItem.mockReturnValue(null);
    expect(getTermsAgreement()).toBe(false);
  });

  test('getTermsAgreement should return true when agreement is saved', () => {
    localStorageMock.getItem.mockReturnValue('true');
    expect(getTermsAgreement()).toBe(true);
  });

  test('setTermsAgreement should save agreement when true', () => {
    setTermsAgreement(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('ecobin-terms-agreed', 'true');
  });

  test('setTermsAgreement should remove agreement when false', () => {
    setTermsAgreement(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('ecobin-terms-agreed');
  });

  test('clearTermsAgreement should remove agreement', () => {
    clearTermsAgreement();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('ecobin-terms-agreed');
  });
});
