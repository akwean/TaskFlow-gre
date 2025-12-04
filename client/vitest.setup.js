import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest expect with Testing Library jest-dom matchers
expect.extend(matchers);
