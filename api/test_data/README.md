# Test Data Directory

## For Integration Tests

To run end-to-end integration tests, place a test PDF in this directory:

```bash
# Copy any PDF you have to this directory
cp ~/path/to/your/document.pdf api/test_data/test.pdf
```

The test will look for these files (in order):
1. `integration_test.pdf`
2. `test.pdf`  
3. `sample.pdf`

Any searchable PDF will work!

## Running the Test

```bash
# After adding a PDF file
docker compose exec api pytest tests/test_e2e_openai_integration.py -v -s
```

**Cost**: ~$0.0005 per run (2 OpenAI API calls)

