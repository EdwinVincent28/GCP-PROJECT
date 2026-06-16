import asyncio
import httpx
import time

TARGET_URL = "https://acs-assignment-497901.appspot.com/health-load"

CONCURRENT_REQUESTS = 50  # Number of parallel tasks hitting your app
TOTAL_BURSTS = 10         # How many times to repeat the flood

async def send_heavy_request(client, request_id):
    try:
        start = time.time()
        response = client.get(TARGET_URL, timeout=30.0)
        duration = time.time() - start
        print(f"Request {request_id}: Status {response.status_code} in {duration:.2f}s")
    except Exception as e:
        print(f"Request {request_id} failed: {e}")

async def main():
    print(f"🚀 Starting load test against: {TARGET_URL}")
    print(f"Flooding with {CONCURRENT_REQUESTS} parallel requests...")
    
    # Using a connection pool to handle rapid requests
    limits = httpx.Limits(max_keepalive_connections=50, max_connections=100)
    async with httpx.AsyncClient(limits=limits) as client:
        for burst in range(TOTAL_BURSTS):
            print(f"\n--- Burst {burst + 1}/{TOTAL_BURSTS} ---")
            tasks = [send_heavy_request(client, i) for i in range(CONCURRENT_REQUESTS)]
            await asyncio.gather(*tasks)
            # Short break between bursts to let the app accumulate load
            await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())