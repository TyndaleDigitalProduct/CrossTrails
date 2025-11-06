import Ajv from 'ajv';
import schema from './crossRefDataFile.schema.json';
import fs from 'fs';
import path from 'path';

const ajv = new Ajv();
const validate = ajv.compile(schema);

const dataDir = path.resolve(__dirname, '../../data/crefs_json');
const jsonFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

describe('CrossReferenceDataFile JSON validation', () => {
  jsonFiles.forEach(file => {
    it(`${file} matches CrossReferenceDataFile schema`, () => {
      const filePath = path.join(dataDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const valid = validate(data);
      if (!valid) {
        throw new Error(
          `${file} failed schema validation:\n` +
            JSON.stringify(validate.errors, null, 2)
        );
      }
      expect(valid).toBe(true);
    });
  });
});
