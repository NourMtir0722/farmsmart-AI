# Plant Scanner Feature

A complete AI-powered plant identification and disease detection system for FarmSmart AI.

## Features

### Frontend (`/scan` page)
- ✅ **Drag & Drop Upload**: Intuitive file upload with visual feedback
- ✅ **Image Preview**: Real-time preview of uploaded images
- ✅ **File Validation**: Supports JPEG, PNG, and WebP formats (max 10MB)
- ✅ **Loading States**: Smooth loading animations during scan
- ✅ **Results Display**: Comprehensive results with plant info, health status, and care tips
- ✅ **Error Handling**: User-friendly error messages
- ✅ **Responsive Design**: Works on desktop and mobile devices

### Backend (API Route)
- ✅ **Image Processing**: Handles file uploads and validation
- ✅ **Plant.id Integration (Optional, gated)**: Disabled by default; API route returns 501 unless `NEXT_PUBLIC_ENABLE_PAID_AI=true`
- ✅ **Mock Responses**: Development-friendly mock data
- ✅ **TypeScript Types**: Full type safety throughout
- ✅ **Error Handling**: Proper error handling and logging

## Setup Instructions

### 1. Environment Configuration

Copy the environment template and add your Plant.id API key:

```bash
cp env.example .env.local
```

Edit `.env.local` and add your Plant.id API key:

```env
PLANT_ID_API_KEY=your_actual_api_key_here
NODE_ENV=development
```

### 2. Get Plant.id API Key

1. Visit [Plant.id API Access Request](https://web.plant.id/api-access-request)
2. Fill out the form to request API access
3. You'll receive an API key via email
4. Add the key to your `.env.local` file

### 3. Development vs Production

- **Development**: Uses mock data for testing (no API key required)
- **Production (Optional, gated)**: Plant.id is optional and disabled by default. API route returns 501 until enabled with `NEXT_PUBLIC_ENABLE_PAID_AI=true` and the API key is configured.

To switch to production mode:
```env
NODE_ENV=production
PLANT_ID_API_KEY=your_api_key
```

## Usage

### Accessing the Scanner
1. Navigate to the main dashboard
2. Click on the "Plant Scanner" card
3. Or go directly to `/scan`

### Using the Scanner
1. **Upload Image**: Drag & drop or click to select an image
2. **Preview**: Review the uploaded image
3. **Scan**: Click "Scan Plant" to analyze
4. **Results**: View plant identification and health assessment

## API Response Format

The scanner returns comprehensive plant information:

```typescript
interface PlantScanResult {
  plantName: string          // Common name of the plant
  scientificName: string     // Scientific/Latin name
  confidence: number         // Confidence percentage (0-100)
  isHealthy: boolean         // Health status
  diseaseInfo?: string       // Disease description (if unhealthy)
  careTips?: string[]        // Plant care recommendations
  imageUrl?: string          // Reference image URL
}
```

## Mock Data

For development, the system includes realistic mock data for:
- **Tomato** (healthy and diseased variants)
- **Basil** (healthy)
- **Cucumber** (healthy)

Each mock response includes:
- Accurate plant names and scientific names
- Realistic confidence scores
- Health status assessment
- Disease information (for unhealthy plants)
- Practical care tips

## Error Handling

The system handles various error scenarios:

- **File Validation**: Invalid file types or sizes
- **API Errors**: Network issues or API failures
- **Processing Errors**: Image processing failures
- **Missing API Key**: Graceful fallback to mock data

## File Requirements

- **Supported Formats**: JPEG, JPG, PNG, WebP
- **Maximum Size**: 10MB
- **Recommended**: Clear, well-lit photos of plant leaves

## Production Deployment

### Environment Variables
```env
PLANT_ID_API_KEY=your_production_api_key
NODE_ENV=production
```

### API Rate Limits
- Plant.id has rate limits based on your plan
- Monitor usage in Plant.id dashboard
- Consider implementing request caching for production

### Security Considerations
- API keys are stored in environment variables
- File uploads are validated and sanitized
- Error messages don't expose sensitive information
 - Paid API usage is gated and disabled by default; routes return 501 until enabled

## Demo paths

- `/debug-inclinometer` – Free demo (no paid APIs)
- Paid/gated pages (disabled by default; routes return 501 until enabled with `NEXT_PUBLIC_ENABLE_PAID_AI=true`):
  - `/plant-scanner`
  - `/ai-measure`

## Troubleshooting

### Common Issues

1. **"No image file provided"**
   - Ensure you're uploading an image file
   - Check file format (JPEG, PNG, WebP only)

2. **"File too large"**
   - Compress image to under 10MB
   - Use image optimization tools

3. **"Failed to scan plant"**
   - Check API key configuration
   - Verify network connectivity
   - Review server logs for details

### Development Mode
- Mock data is used when `NODE_ENV=development`
- No API key required for testing
- Realistic responses for all test scenarios

## Future Enhancements

Potential improvements for the plant scanner:

- **Batch Processing**: Upload multiple images at once
- **History**: Save and review previous scans
- **Advanced Analytics**: Track plant health over time
- **Export Results**: PDF reports and data export
- **Offline Mode**: Basic identification without internet
- **Camera Integration**: Direct camera capture on mobile

## API Documentation

For detailed Plant.id API documentation:
- [Plant.id API Docs](https://github.com/flowerchecker/Plant-id-API/wiki)
- [API Endpoints](https://web.plant.id/api-docs)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for error details
3. Verify API key configuration
4. Test with mock data in development mode 