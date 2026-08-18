package com.rental.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rental.model.Car;
import com.rental.repository.CarRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Customer-facing AI assistant. If ANTHROPIC_API_KEY is configured it calls
 * the real Claude API (Messages endpoint) with the live car inventory as
 * context. Falls back to a deterministic keyword-based responder if no key.
 */
@Slf4j
@Service
public class AiChatService {

    private static final String ANTHROPIC_BASE = "https://api.anthropic.com";
    private static final String MESSAGES_PATH  = "/v1/messages";

    private final WebClient webClient;
    private final CarRepository carRepository;
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${app.ai.anthropic-api-key}")
    private String apiKey;

    @Value("${app.ai.anthropic-model}")
    private String model;

    public AiChatService(WebClient.Builder builder, CarRepository carRepository) {
        this.webClient = builder.baseUrl(ANTHROPIC_BASE).build();
        this.carRepository = carRepository;
    }

    public String chat(String userMessage) {
        if (apiKey == null || apiKey.isBlank()) {
            return fallbackResponse(userMessage);
        }

        try {
            String inventoryContext = buildInventoryContext();
            String systemPrompt = "You are a helpful car rental assistant for 'DriveEasy Rentals'. "
                    + "Answer concisely (max 4 sentences) using ONLY the inventory data given below. "
                    + "If nothing matches the request, say so plainly.\n\nCurrent inventory:\n" + inventoryContext;

            Map<String, Object> body = Map.of(
                    "model", model,
                    "max_tokens", 400,
                    "system", systemPrompt,
                    "messages", List.of(Map.of("role", "user", "content", userMessage))
            );

            JsonNode response = webClient.post()
                    .uri(MESSAGES_PATH)
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .timeout(Duration.ofSeconds(20))
                    .block();

            if (response != null && response.has("content") && response.get("content").isArray()
                    && response.get("content").size() > 0) {
                return response.get("content").get(0).path("text").asText();
            }
            return fallbackResponse(userMessage);
        } catch (Exception ex) {
            log.warn("Claude API call failed, using fallback responder: {}", ex.getMessage());
            return fallbackResponse(userMessage);
        }
    }

    private String buildInventoryContext() {
        List<Car> cars = carRepository.findByActiveTrue();
        return cars.stream()
                .map(c -> "- %s %s: %d seats, Rs.%s/day".formatted(c.getType(), c.getModel(), c.getSeats(), c.getDailyRate()))
                .collect(Collectors.joining("\n"));
    }

    private String fallbackResponse(String userMessage) {
        String msg = userMessage.toLowerCase();
        List<Car> cars = carRepository.findByActiveTrue();

        if (msg.contains("cheap") || msg.contains("budget") || msg.contains("low")) {
            return cars.stream().min((a, b) -> a.getDailyRate().compareTo(b.getDailyRate()))
                    .map(c -> "Our most budget-friendly option right now is the %s %s at Rs.%s/day."
                            .formatted(c.getType(), c.getModel(), c.getDailyRate()))
                    .orElse("I couldn't find any cars in inventory right now.");
        }
        if (msg.contains("group") || msg.contains("traveller") || msg.contains("family") || msg.contains("many people")) {
            return cars.stream().max((a, b) -> a.getSeats().compareTo(b.getSeats()))
                    .map(c -> "For a larger group, the %s %s seats %d and would be a good fit."
                            .formatted(c.getType(), c.getModel(), c.getSeats()))
                    .orElse("I couldn't find any cars in inventory right now.");
        }
        if (msg.contains("suv")) {
            return "We have SUVs available — check the 'Browse Cars' tab and filter by type to see current SUV models and rates.";
        }
        return "I'm running in offline mode (no AI key configured), but I can tell you: we have "
                + cars.size() + " cars available across SUV, Sedan, and Traveller types. "
                + "Try asking about budget, group size, or a specific car type, or set ANTHROPIC_API_KEY for full natural-language answers.";
    }
}
