#!/bin/bash
# Run all backend tests serially to avoid DB conflicts
cd "$(dirname "$0")"
npm test -- --runInBand 